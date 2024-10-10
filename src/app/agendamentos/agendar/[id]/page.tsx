'use client';
import * as React from 'react';
import dayjs from 'dayjs';

import Content from "@/components/Content";
import { useParams, useRouter } from "next/navigation";
import { ContentPaste } from '@mui/icons-material';
import { useEffect, useRef, useState } from "react";
import { Form, Formik, FormikProps } from "formik";
import LoadingOverlay from "@/components/Loading";
import * as Yup from 'yup';
import api from "@/server/api";
import { showErrorToast } from "@/utils/messages.helper";
import ConfirmModal from "@/components/Modal/confirmModal";
import ContentFixedButton from "@/components/Button/ContentFixedButton";
import InputForm from "@/components/Form/Input";
import { Button } from "@/components/Button";
import { getScheduling } from "@/server/services";
import FormRow from "@/components/Form/FormRow";
import ConfirmDeleteModal from "@/components/Modal/confirmDeleteModal";
import DateTimeInput from '@/components/Form/DateTimeInput';
import TextareaForm from '@/components/Form/TextArea';

interface FormValues {
  obs: string;
  data_hora: string;
}

export default function DataAgendamento() {
  const params = useParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpenConfirm, setIsOpenConfirm] = useState(false);
  const [allowNext, setAllowNext] = useState(false);
  const [isOpenConfirmDelete, setIsOpenConfirmDelete] = useState(false);
  const [allowDelete, setAllowDelete] = useState(false);
  const formikRef = useRef<FormikProps<any> | null>(null);
  const [validation, setValidation] = useState(false);
  const router = useRouter();
  const [initialValues, setInitialValues] = useState<FormValues>({
    obs: '',
    data_hora: dayjs().format('DD/MM/YYYY HH:mm')
  });

  const getData = async (id: number) => {
    const data = await getScheduling(id);
    console.log(data)
    setInitialValues({
      obs: data?.obs || '',
      data_hora: data?.data_hora ? dayjs(data.data_hora).format('DD/MM/YYYY HH:mm') : dayjs().format('DD/MM/YYYY HH:mm')
    });
  };

  useEffect(() => {
    if (params.id != "cadastro") {
      getData(Number(params.id));
    }
  }, [params.id]);

  const handleModalConfirm = () => setIsOpenConfirm(!isOpenConfirm);
  const handleModalConfirmDelete = () => setIsOpenConfirmDelete(!isOpenConfirmDelete);

  const validationSchema = Yup.object().shape({
    data_hora: Yup.string().nonNullable().required('Data e hora são obrigatórios'),
  });

  useEffect(() => {
    document.title = `${params.id === "cadastro" ? 'Novo Agendamento' : "Editar Agendamento"} | Colégio Soberano`;
  }, [params.id]);

  useEffect(() => {
    if (allowNext) router.back();
  }, [allowNext]);

  useEffect(() => {
    if (allowDelete) handleDelete();
  }, [allowDelete]);

  const handleSubmit = async (values: any, actions: any) => {
    setLoading(true);
    try {
      let data = {
        ...values, data_hora: dayjs(values.data_hora, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DDTHH:mm:ss'), usuario: {
          id: localStorage.getItem("user_soberano") ? JSON.parse(localStorage.getItem("user_soberano") || '{}')?.id : 6
        }
      };
      if (params.id === "cadastro") {
        await api.post('/scheduling', data).then((res) => {
          window.location.assign(`/agendamentos`);
        });
        setLoading(false);
      } else {
        await api.patch(`/scheduling/${params.id}`, data).then((res) => {
          window.location.assign(`/agendamentos`);
        });
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      showErrorToast("Erro ao salvar agendamento!");
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/scheduling/${params.id}`);
      setLoading(false);
      // window.location.assign(`/agendamentos`);
    } catch (error) {
      setLoading(false);
      showErrorToast("Erro ao deletar usuário!");
    }
  };

  if (loading) return <LoadingOverlay />;

  return (
    <Content>
      <div className="w-full flex flex-col items-center mt-2">
        <div className="flex items-center justify-center">
          <ContentPaste />
          <h1 className="text-2xl font-bold mb-4 items-center pt-5">{params.id === "cadastro" ? 'Novo Agendamento' : "Editar Agendamento"}</h1>
        </div>

        <div className='flex flex-col w-9/12 pt-6 justify-center items-center'>
          <Formik<FormValues>
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            innerRef={formikRef}
            enableReinitialize
          >
            {({ isSubmitting, setFieldValue, values, errors }) => (
              <Form className='h-full flex justify-between w-full flex-col pb-44'>
                <FormRow>
                  <DateTimeInput
                    value={values.data_hora}
                    onChange={(newValue: any) => setFieldValue("data_hora", newValue.format('DD/MM/YYYY HH:mm'))}
                  />
                  <TextareaForm
                    name="obs"
                    title="Observação"
                    value={values.obs}
                    onChange={(event) => setFieldValue("obs", event.target.value)}
                    error={validation && errors.obs && typeof errors.obs == 'string' ? errors.obs : ''}
                    className="w-1/2"
                  />
                </FormRow>
                <ContentFixedButton>
                  {params.id != "cadastro" ?
                    <div className="mr-8 max-mxs:mr-2">
                      <Button type="button" size="small" color="warning" fill="filled" style={{ border: '2px solid black' }} onClick={handleModalConfirmDelete}>
                        DELETAR
                      </Button>
                    </div>
                    : null}
                  <Button type="button" size="small" color="white" style={{ border: '2px solid black' }} onClick={handleModalConfirm}>
                    VOLTAR
                  </Button>
                  <div className="ml-8 max-mxs:ml-2">
                    <Button type="button" size="small" color="black" fill="filled" style={{ border: '2px solid black' }} onClick={() => {
                      validationSchema.validate(values)
                        .then(() => {
                          handleSubmit(values, null);
                        })
                        .catch((e) => {
                          setValidation(true);
                          showErrorToast(e.toString().replace(/^[^:]+:\s*/, ""));
                        });
                    }}>
                      SALVAR
                    </Button>
                  </div>
                </ContentFixedButton>
              </Form>
            )}
          </Formik>
        </div>
      </div>
      <ConfirmModal isOpenModal={isOpenConfirm} setIsOpenModal={setIsOpenConfirm} allow={allowNext} setAllow={setAllowNext} />
      <ConfirmDeleteModal isOpenModal={isOpenConfirmDelete} setIsOpenModal={setIsOpenConfirmDelete} allow={allowDelete} setAllow={setAllowDelete} />
      {loading && <LoadingOverlay />}
    </Content>
  );
}
